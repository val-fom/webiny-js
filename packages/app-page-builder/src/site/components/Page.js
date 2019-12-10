// @flow
import * as React from "react";
import type { Location } from "react-router-dom";
import { useQuery } from "react-apollo";
import { Content, buildQueryProps } from "./Page/index";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { get } from "lodash";
import invariant from "invariant";
import { CircularProgress } from "@webiny/ui/Progress";

const defaultPages = {
    error: null,
    notFound: null
};

type Props = { match: Object, location: Location };

const NO_404_PAGE_DEFAULT =
    "Could not fetch 404 (not found) page nor was a default page provided (set via PageBuilderProvider).";
const NO_ERROR_PAGE_DEFAULT =
    "Could not fetch error page nor was a default page provided (set via PageBuilderProvider).";

const Page = ({ location }: Props) => {
    const { query, ...options } = buildQueryProps({ location, defaultPages });
    const pageBuilder = usePageBuilder();

    const { loading, data, error: gqlError } = useQuery(query, options);

    if (loading) {
        const Loader = get(pageBuilder, "defaults.pages.loader");
        invariant(Loader, NO_ERROR_PAGE_DEFAULT);
        console.log("Trying to get loader page");
        if (Loader) {
            console.log("Loader page found");
            return <Loader />;
        }
        return <CircularProgress />;
    }

    if (gqlError) {
        const Component = get(pageBuilder, "defaults.pages.error");
        invariant(Component, NO_ERROR_PAGE_DEFAULT);

        return <Component />;
    }

    // Not pretty, but "onComplete" callback executed too late. Will be executed only once.
    if (!defaultPages.error) {
        defaultPages.error = data.pageBuilder.errorPage;
    }

    if (!defaultPages.notFound) {
        defaultPages.notFound = data.pageBuilder.notFoundPage;
    }

    const { data: page, error: pageError } = data.pageBuilder.page;
    const { data: settings } = data.pageBuilder.getSettings;

    if (page) {
        return <Content settings={settings} page={page} />;
    }

    if (pageError.code === "NOT_FOUND") {
        if (defaultPages.notFound) {
            return <Content settings={settings} page={defaultPages.notFound.data} />;
        }

        const Component = get(pageBuilder, "defaults.pages.notFound");
        invariant(Component, NO_404_PAGE_DEFAULT);
        return <Component />;
    }

    if (defaultPages.error) {
        return <Content settings={settings} page={defaultPages.error.data} />;
    }

    const Component = get(pageBuilder, "defaults.pages.error");
    invariant(Component, NO_ERROR_PAGE_DEFAULT);
    return <Component />;
};

export default Page;
